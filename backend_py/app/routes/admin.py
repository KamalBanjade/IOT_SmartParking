from fastapi import APIRouter, Depends, HTTPException, Query
from app.middleware.auth import require_admin, require_operator
from app.config.db import get_pool
from typing import Optional
import asyncio
from datetime import datetime, timezone
from app.services import session_service

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
async def get_dashboard(payload: dict = Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            stats = {}
            is_admin = payload.get("role") == "admin"
            
            slots = await conn.fetchrow("""
                SELECT COUNT(*) as total, 
                COUNT(*) FILTER (WHERE status = 'occupied') as occupied 
                FROM parking_slots
            """)
            stats['totalSlots'] = int(slots['total'])
            stats['occupiedSlots'] = int(slots['occupied'])
            stats['availableSlots'] = stats['totalSlots'] - stats['occupiedSlots']
            
            sessions = await conn.fetchrow("SELECT COUNT(*) as active FROM parking_sessions WHERE status = 'active'")
            stats['activeSessions'] = int(sessions['active'])
            
            if is_admin:
                revenue = await conn.fetchrow("""
                    SELECT 
                        COALESCE(SUM(amount) FILTER (WHERE paid_at::date = CURRENT_DATE), 0) as today,
                        COALESCE(SUM(amount), 0) as total
                    FROM payments 
                    WHERE status = 'paid'
                """)
                stats['todayRevenue'] = float(revenue['today'])
                stats['totalRevenue'] = float(revenue['total'])
                
                payments = await conn.fetch("""
                    SELECT method, COUNT(*) as count, SUM(amount) as amount 
                    FROM payments 
                    WHERE status = 'paid'
                    GROUP BY method
                """)
                stats['paymentMethods'] = [dict(r) for r in payments]
                for pm in stats['paymentMethods']:
                    pm['amount'] = float(pm['amount'])
            else:
                stats['todayRevenue'] = 0
                stats['totalRevenue'] = 0
                stats['paymentMethods'] = []

            dwell = await conn.fetch("""
                SELECT 
                    CASE 
                        WHEN duration_minutes < 60 THEN 'Short (<1h)'
                        WHEN duration_minutes BETWEEN 60 AND 180 THEN 'Medium (1-3h)'
                        WHEN duration_minutes BETWEEN 180 AND 480 THEN 'Long (3-8h)'
                        ELSE 'Extended (8h+)'
                    END as bucket,
                    COUNT(*) as count
                FROM parking_sessions
                WHERE status = 'completed'
                GROUP BY bucket
            """)
            stats['dwellDistribution'] = [dict(r) for r in dwell]

            activity = await conn.fetch("""
                SELECT ps.entry_time, ps.exit_time, ps.status, s.label as slot_label, u.name as user_name
                FROM parking_sessions ps
                JOIN parking_slots s ON ps.slot_id = s.id
                LEFT JOIN users u ON ps.user_id = u.id
                ORDER BY ps.id DESC LIMIT 10
            """)
            stats['recentActivity'] = [dict(r) for r in activity]
            
            return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_admin_sessions(payload: dict = Depends(require_operator), date: Optional[str] = None, page: int = 1, limit: int = 15):
    try:
      offset = (page - 1) * limit
      pool = get_pool()
      async with pool.acquire() as conn:
          query = """
              SELECT ps.*, s.label as slot_label, u.name as user_name, u.phone as user_phone, u.email as user_email,
                     (SELECT id FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_id,
                     (SELECT amount FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as amount,
                     (SELECT method FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_method,
                     (SELECT status FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as payment_status,
                     (SELECT transaction_id FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as transaction_id,
                     (SELECT gateway_response FROM payments WHERE session_id = ps.id ORDER BY id DESC LIMIT 1) as gateway_response
              FROM parking_sessions ps
              JOIN parking_slots s ON ps.slot_id = s.id
              LEFT JOIN users u ON ps.user_id = u.id
          """
          params = []
          where_clauses = []
          if date:
              where_clauses.append(f"ps.entry_time::date = ${len(params)+1}")
              params.append(date)
          if where_clauses:
              query += " WHERE " + " AND ".join(where_clauses)
          query += f" ORDER BY ps.entry_time DESC LIMIT ${len(params)+1} OFFSET ${len(params)+2}"
          params.extend([limit, offset])
          records = await conn.fetch(query, *params)
          results = []
          for r in records:
              d = dict(r)
              
              # Auto-recovery for "Paid but Active" sessions
              if d['status'] == 'active' and d.get('payment_status') == 'paid':
                  d['status'] = 'completed'
                  # If exit_time is missing, try to use the paid_at from a payment or now
                  if not d.get('exit_time'):
                      d['exit_time'] = datetime.now(timezone.utc)
                  # Fix the database in the background
                  asyncio.create_task(session_service.end_session_by_id(d['id']))

              if d.get('amount') is not None: d['amount'] = float(d['amount'])
              results.append(d)
          return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/revenue")
async def get_revenue_analytics(payload: dict = Depends(require_operator), period: str = "7d"):
    days = 7
    if period == '30d': days = 30
    elif period == '90d': days = 90
    
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            is_admin = payload.get("role") == "admin"
            if not is_admin:
                query = "SELECT DATE(entry_time) as date, 0 as revenue, COUNT(*) as sessions FROM parking_sessions WHERE entry_time >= CURRENT_DATE - INTERVAL '1 day' * $1 GROUP BY DATE(entry_time) ORDER BY date ASC"
                records = await conn.fetch(query, days)
                return [dict(r) for r in records]
            
            query = """
                SELECT DATE(paid_at) as date, SUM(amount) as revenue, COUNT(id) as sessions
                FROM payments
                WHERE status = 'paid' AND paid_at >= CURRENT_DATE - INTERVAL '1 day' * $1
                GROUP BY DATE(paid_at) ORDER BY date ASC
            """
            records = await conn.fetch(query, days)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/peak-hours")
async def get_peak_hours(payload: dict = Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            query = """
                SELECT EXTRACT(HOUR FROM entry_time) as hour,
                COUNT(*) * 1.0 / NULLIF((SELECT COUNT(DISTINCT DATE(entry_time)) FROM parking_sessions), 0) / NULLIF((SELECT COUNT(*) FROM parking_slots), 0) as avgOccupancy
                FROM parking_sessions GROUP BY hour ORDER BY hour ASC
            """
            records = await conn.fetch(query)
            return [{"hour": int(r['hour']), "avgOccupancy": float(r['avgoccupancy'] or 0)} for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/slot-performance")
async def get_slot_performance(payload: dict = Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            query = """
                SELECT s.id as slotId, s.label, COUNT(ps.id) as totalSessions,
                COALESCE(SUM(p.amount), 0) as totalRevenue, AVG(ps.duration_minutes) as avgDurationMinutes
                FROM parking_slots s
                LEFT JOIN parking_sessions ps ON s.id = ps.slot_id
                LEFT JOIN payments p ON ps.id = p.session_id AND p.status = 'paid'
                GROUP BY s.id, s.label ORDER BY totalRevenue DESC
            """
            records = await conn.fetch(query)
            is_admin = payload.get("role") == "admin"
            return [{
                "slotId": r['slotid'], "label": r['label'], "totalSessions": r['totalsessions'],
                "totalRevenue": float(r['totalrevenue']) if is_admin else 0,
                "avgDurationMinutes": float(r['avgdurationminutes'] or 0)
            } for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/user-growth")
async def get_user_growth(payload: dict = Depends(require_operator), period: str = "7d"):
    days = 7
    if period == '30d': days = 30
    elif period == '90d': days = 90
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            is_admin = payload.get("role") == "admin"
            query = f"""
                SELECT date_series.date, COALESCE(u_stats.members, 0) as members, COALESCE(u_stats.guests, 0) as guests
                {', COALESCE(o_stats.staff, 0) as staff' if is_admin else ''}
                FROM (SELECT CURRENT_DATE - i as date FROM generate_series(0, $1) i) date_series
                LEFT JOIN (
                    SELECT DATE(created_at) as date, COUNT(*) FILTER (WHERE is_member = TRUE) as members, COUNT(*) FILTER (WHERE is_member = FALSE) as guests
                    FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1 GROUP BY DATE(created_at)
                ) u_stats ON date_series.date = u_stats.date
                {f"LEFT JOIN (SELECT DATE(created_at) as date, COUNT(*) as staff FROM operators WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1 GROUP BY DATE(created_at)) o_stats ON date_series.date = o_stats.date" if is_admin else ""}
                ORDER BY date_series.date ASC
            """
            records = await conn.fetch(query, days)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/members")
async def get_members_analytics(payload: dict = Depends(require_operator)):
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            is_admin = payload.get("role") == "admin"
            totals = await conn.fetchrow("""
                SELECT COUNT(*) as totalMembers,
                (SELECT COUNT(DISTINCT user_id) FROM parking_sessions WHERE entry_time >= CURRENT_DATE - INTERVAL '30 days') as activeThisMonth,
                COALESCE((SELECT SUM(points) FROM loyalty_points), 0) as totalPointsAwarded,
                COALESCE((SELECT COUNT(*) * 25 FROM loyalty_points WHERE points < 0), 0) as totalDiscountsGiven
                FROM users WHERE is_member = TRUE
            """)
            stats = {
                "totalMembers": int(totals['totalmembers']),
                "activeThisMonth": int(totals['activethismonth']),
                "totalPointsAwarded": int(totals['totalpointsawarded']),
                "totalDiscountsGiven": int(totals['totaldiscountsgiven']),
                "topMembers": []
            }
            if is_admin:
                top = await conn.fetch("""
                    SELECT u.name, u.phone, COUNT(ps.id) as totalSessions, SUM(p.amount) as totalSpent,
                    (SELECT SUM(points) FROM loyalty_points WHERE user_id = u.id) as points
                    FROM users u JOIN parking_sessions ps ON u.id = ps.user_id
                    JOIN payments p ON ps.id = p.session_id AND p.status = 'paid'
                    WHERE u.is_member = TRUE GROUP BY u.id ORDER BY totalSpent DESC LIMIT 5
                """)
                stats['topMembers'] = [{
                    "name": r['name'], "phone": r['phone'], "totalSessions": int(r['totalsessions']),
                    "totalSpent": float(r['totalspent']), "points": int(r['points'] or 0)
                } for r in top]
            return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

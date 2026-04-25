import mqtt from 'mqtt';
import * as slotService from '../services/slotService.js';
import * as sessionService from '../services/sessionService.js';
import * as paymentService from '../services/paymentService.js';

export function initMqtt(io) {
  const broker = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
  const topic = process.env.MQTT_TOPIC_SLOTS || 'parking/slots/#';

  const client = mqtt.connect(broker);

  client.on('connect', () => {
    console.log(`[MQTT] Connected to broker: ${broker}`);
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`[MQTT] Subscribed to topic: ${topic}`);
      } else {
        console.error(`[MQTT] Subscription error: ${err.message}`);
      }
    });
  });

  client.on('message', async (receivedTopic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const { status, controllerId } = payload;

      console.log(`[MQTT] Message received on ${receivedTopic}: ${message.toString()}`);

      if (!['occupied', 'available'].includes(status)) {
        console.warn(`[MQTT] Invalid status received: ${status}`);
        return;
      }

      // Update slot status
      const slot = await slotService.updateSlotStatus(controllerId, status);
      
      if (status === 'occupied') {
        // Start session
        await sessionService.startSession(slot.id);
        console.log(`[MQTT] slot ${slot.label} → occupied (Session started)`);
      } else if (status === 'available') {
        // End session
        const session = await sessionService.endSession(slot.id);
        if (session) {
          // Create payment record
          await paymentService.createPayment(session.id, session.amountDue);
          console.log(`[MQTT] slot ${slot.label} → available (Session ended, amount due: ${session.amountDue})`);
        } else {
          console.log(`[MQTT] slot ${slot.label} → available`);
        }
      }

      // Emit real-time update via Socket.IO
      io.emit('slotUpdated', {
        slotId: slot.id,
        label: slot.label,
        status: slot.status,
        last_updated: slot.last_updated
      });

    } catch (err) {
      console.error('[MQTT] Handler error:', err.message);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Connection error:', err.message);
  });

  return client;
}

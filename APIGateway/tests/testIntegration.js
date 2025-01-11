const request = require("supertest");
const mqtt = require("mqtt");
const app = require("../src/app"); // Path to your API Gateway application

describe("API Gateway Integration Tests", () => {
    let mqttClient;

    beforeAll(() => {
        // Initialize MQTT client
        mqttClient = mqtt.connect("mqtt://localhost:1883");
    });

    afterAll(() => {
        // Close MQTT connection
        mqttClient.end();
    });

    // Subscribe to the MQTT topic
    mqttClient.subscribe(topic, (err) => {
        if (err) return done(err);

    });
});


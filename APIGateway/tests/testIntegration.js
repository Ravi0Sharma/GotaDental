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

    it("should return 400 for missing fields in login", async () => {
        const response = await request(app)
            .post("/login")
            .send({ username: "user1" }); // Missing password

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields");
    });

    it("should return 400 for missing fields in registration", async () => {
        const response = await request(app)
            .post("/register")
            .send({ username: "user1" }); // Missing password and other fields

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields");
    });

    it("should return 201 Created for a successful registration", async () => {
        const response = await request(app)
            .post("/register")
            .send({ username: "newUser", password: "securePass123" });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered successfully");
    });

    it("should return 201 Created for a successful registration", async () => {
        const response = await request(app)
            .post("/register")
            .send({ username: "newUser", password: "securePass123" });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered successfully");
    });

    // Subscribe to the MQTT topic
    mqttClient.subscribe(topic, (err) => {
        if (err) return done(err);

    });
});


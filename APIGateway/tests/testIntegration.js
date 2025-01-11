const request = require("supertest");
const mqtt = require("mqtt");

const API_GATEWAY_URL = "http://apigate:4000"; // Use the service name from docker-compose
const MQTT_BROKER_URL = "mqtt://rabbitmq:1883"; // RabbitMQ service name

describe("API Gateway Integration Tests", () => {
    let mqttClient;

    // Setup MQTT client
    beforeAll(() => {
        mqttClient = mqtt.connect(MQTT_BROKER_URL);
    });

    // Close MQTT connection
    afterAll(() => {
        mqttClient.end();
    });

    it("should return 400 for missing fields in login", async () => {
        const response = await request(API_GATEWAY_URL)
            .post("/login")
            .send({ username: "testUser" }); // Missing password
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields");
    });

    it("should return 400 for missing fields in registration", async () => {
        const response = await request(API_GATEWAY_URL)
            .post("/register")
            .send({ username: "testUser" }); // Missing password
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields");
    });

    it("should return 201 Created for a successful registration", async () => {
        const response = await request(API_GATEWAY_URL)
            .post("/register")
            .send({ username: "newUser", password: "securePassword" });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered successfully");
    });

    it("should return 200 OK for a successful login", async () => {
        const response = await request(API_GATEWAY_URL)
            .post("/login")
            .send({ username: "newUser", password: "securePassword" });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
    });

    it("should return 401 Unauthorized for invalid login credentials", async () => {
        const response = await request(API_GATEWAY_URL)
            .post("/login")
            .send({ username: "newUser", password: "wrongPassword" });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid credentials");
    });

    it("should publish a message to MQTT on registration", (done) => {
        const topic = "patients/register";
        const expectedMessage = { username: "newUser", status: "registered" };

        mqttClient.subscribe(topic, (err) => {
            if (err) return done(err);

            request(API_GATEWAY_URL)
                .post("/register")
                .send({ username: "newUser", password: "securePassword" })
                .end(() => {
                    mqttClient.on("message", (receivedTopic, message) => {
                        if (receivedTopic === topic) {
                            const parsedMessage = JSON.parse(message.toString());
                            expect(parsedMessage.username).toBe(expectedMessage.username);
                            expect(parsedMessage.status).toBe(expectedMessage.status);
                            done();
                        }
                    });
                });
        });
    });

    it("should publish a message to MQTT on login", (done) => {
        const topic = "patients/login";
        const expectedMessage = { username: "newUser", status: "logged_in" };

        mqttClient.subscribe(topic, (err) => {
            if (err) return done(err);

            request(API_GATEWAY_URL)
                .post("/login")
                .send({ username: "newUser", password: "securePassword" })
                .end(() => {
                    mqttClient.on("message", (receivedTopic, message) => {
                        if (receivedTopic === topic) {
                            const parsedMessage = JSON.parse(message.toString());
                            expect(parsedMessage.username).toBe(expectedMessage.username);
                            expect(parsedMessage.status).toBe(expectedMessage.status);
                            done();
                        }
                    });
                });
        });
    });
});

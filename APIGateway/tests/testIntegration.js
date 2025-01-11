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

    it("should return 200 OK for a successful login", async () => {
        const response = await request(app)
            .post("/login")
            .send({ username: "newUser", password: "securePass123" });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
    });

    it("should return 401 Unauthorized for invalid login credentials", async () => {
        const response = await request(app)
            .post("/login")
            .send({ username: "user1", password: "wrongPassword" });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid credentials");
    });

    it("should publish a message to the MQTT topic on registration", (done) => {
        const topic = "patients/register";
        const messageContent = { username: "newUser", status: "registered" };

        // Subscribe to the MQTT topic
        mqttClient.subscribe(topic, (err) => {
            if (err) return done(err);

            // Simulate a registration request
            request(app)
                .post("/register")
                .send({ username: "newUser", password: "securePass123" })
                .end(() => {
                    mqttClient.on("message", (receivedTopic, message) => {
                        if (receivedTopic === topic) {
                            const receivedMessage = JSON.parse(message.toString());
                            expect(receivedMessage.username).toBe(messageContent.username);
                            expect(receivedMessage.status).toBe(messageContent.status);
                            done();
                        }
                    });
                });
        });
    });

    it("should publish a message to the MQTT topic on login", (done) => {
        const topic = "patients/login";
        const messageContent = { username: "newUser", status: "logged_in" };

        // Subscribe to the MQTT topic
        mqttClient.subscribe(topic, (err) => {
            if (err) return done(err);

            // Simulate a login request
            request(app)
                .post("/login")
                .send({ username: "newUser", password: "securePass123" })
                .end(() => {
                    mqttClient.on("message", (receivedTopic, message) => {
                        if (receivedTopic === topic) {
                            const receivedMessage = JSON.parse(message.toString());
                            expect(receivedMessage.username).toBe(messageContent.username);
                            expect(receivedMessage.status).toBe(messageContent.status);
                            done();
                        }
                    });
                });
        });
    });
});

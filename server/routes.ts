import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const twilioWebhookSchema = z.object({
  MessageSid: z.string(),
  From: z.string(),
  To: z.string(),
  Body: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Clear all messages
  app.delete("/api/messages", async (req, res) => {
    try {
      await storage.clearMessages();
      res.json({ message: "Messages cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // Twilio webhook endpoint for receiving SMS
  app.post("/api/webhooks/sms", async (req, res) => {
    try {
      const webhookData = twilioWebhookSchema.parse(req.body);
      
      // Check if message already exists (duplicate webhook)
      const existingMessage = await storage.getMessageByTwilioSid(webhookData.MessageSid);
      if (existingMessage) {
        return res.status(200).send("OK"); // Acknowledge duplicate
      }

      const messageData = {
        from: webhookData.From,
        to: webhookData.To,
        body: webhookData.Body,
        twilioSid: webhookData.MessageSid,
      };

      const validatedMessage = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedMessage);
      
      console.log(`New SMS received from ${message.from}: ${message.body}`);
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Invalid webhook data" });
    }
  });

  // Get temp phone number (from environment)
  app.get("/api/phone-number", async (req, res) => {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!phoneNumber) {
      return res.status(500).json({ 
        message: "Phone number not configured. Please set TWILIO_PHONE_NUMBER environment variable." 
      });
    }
    res.json({ phoneNumber });
  });

  const httpServer = createServer(app);
  return httpServer;
}

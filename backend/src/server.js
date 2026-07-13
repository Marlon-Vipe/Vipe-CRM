require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const invitationsRoutes = require("./routes/invitations");
const channelsRoutes = require("./routes/channels");
const messagesRoutes = require("./routes/messages");
const webhooksWhatsappRoutes = require("./routes/webhooksWhatsapp");
const billingRoutes = require("./routes/billing");
const webhooksBillingRoutes = require("./routes/webhooksBilling");

const app = express();

// Necesario para que req.protocol refleje https real detrás de un proxy
// (Railway/similares) — la validación de firma de Twilio depende de la URL
// exacta que Twilio ve, incluyendo el esquema.
app.set("trust proxy", true);

app.use(cors());

// El webhook de Stripe necesita el body crudo (sin parsear) para verificar
// la firma, así que se monta antes de express.json() global.
app.use("/webhooks/billing", webhooksBillingRoutes);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/invitations", invitationsRoutes);
app.use("/channels", channelsRoutes);
app.use("/conversations", messagesRoutes);
app.use("/webhooks/whatsapp", webhooksWhatsappRoutes);
app.use("/billing", billingRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend CRM Inmobiliario escuchando en http://localhost:${port}`);
});

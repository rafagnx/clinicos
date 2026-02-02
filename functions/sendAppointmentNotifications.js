import { base44 } from "@/lib/base44Client";

/**
 * Envia notificações push sobre novos agendamentos
 */
export async function sendAppointmentNotifications(appointment, eventType = "created") {
  try {
    const messages = {
      created: {
        title: "Novo Agendamento",
        message: `Novo agendamento com ${appointment.patient_name} em ${appointment.date} às ${appointment.start_time}`
      },
      confirmed: {
        title: "Agendamento Confirmado",
        message: `${appointment.patient_name} confirmou a consulta em ${appointment.date} às ${appointment.start_time}`
      },
      cancelled: {
        title: "Agendamento Cancelado",
        message: `O agendamento com ${appointment.patient_name} em ${appointment.date} foi cancelado`
      },
      reminder_24h: {
        title: "Lembrete - Consulta em 24h",
        message: `Você tem consulta com ${appointment.patient_name} amanhã às ${appointment.start_time}`
      },
      reminder_2h: {
        title: "Lembrete - Consulta em 2 horas",
        message: `Consulta com ${appointment.patient_name} em 2 horas às ${appointment.start_time}`
      }
    };

    const messageData = messages[eventType] || messages.created;

    // GUARD: Safely get tokens, skip if API method unavailable
    let tokens = [];
    try {
      // The `filter` method may not exist on all clients. Use `list` as fallback.
      if (base44.entities.UserDeviceToken?.filter) {
        tokens = await base44.entities.UserDeviceToken.filter({
          user_email: appointment.professional_email,
          enabled: true
        });
      } else if (base44.entities.UserDeviceToken?.list) {
        const all = await base44.entities.UserDeviceToken.list();
        tokens = (all || []).filter(t => t.user_email === appointment.professional_email && t.enabled);
      }
    } catch (filterError) {
      console.warn("Falha ao buscar tokens de dispositivo, pulando notificação push:", filterError.message);
    }

    if (!tokens || tokens.length === 0) {
      console.log("Nenhum dispositivo registrado para notificações (ou erro de busca)");
      return;
    }

    // Envia notificação push para cada dispositivo
    for (const tokenRecord of tokens) {
      try {
        await sendPushNotification({
          tokenRecord: device_token,
          messageData: {
            title: messageData.title,
            body: messageData.message,
            data: {
              id: appointment.id,
              appointmentId: appointment.id,
              type: "appointment"
            }
          }
        });
      } catch (err) {
        console.error("Erro ao enviar push:", err);
      }
    }

    // Também cria uma notificação interna no sistema
    await base44.entities.Notification.create({
      user_id: appointment.professional_id,
      type: "appointment",
      title: messageData.title,
      message: messageData.message,
      appointment_id: appointment.id,
      read: false
    });

  } catch (error) {
    console.error("Erro na função sendAppointmentNotifications:", error);
  }
}

async function sendPushNotification({ tokenRecord, messageData }) {
  // Esta é uma representação da chamada de API para o serviço de push (ex: Firebase)
  // No Base44, isso seria gerenciado pela infraestrutura da plataforma
  console.log(`Enviando push para ${tokenRecord}: ${messageData.title}`);
  return true;
}


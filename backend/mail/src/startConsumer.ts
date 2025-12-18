import amqp from "amqplib"
import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

export const startConsumer = async()=>{
    try{
        const connection = await amqp.connect({
            protocol:"amqp",
            hostname:process.env.RABBIT_MQ_HOST,
            port:5672,
            username: process.env.RABBIT_MQ_USER,
            password: process.env.RABBIT_MQ_PASSWORD,
            vhost: process.env.RABBIT_MQ_VHOST
           });
    
           const channel = await connection.createChannel();

           const queueName = "send-mail";

           await channel.assertQueue(queueName,{durable:true});

           channel.consume(queueName, async(message)=>{
               if(message){
                   const {to,subject,body} = JSON.parse(message.content.toString());

                   const transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    auth: {
                        user: process.env.NODEMAILER_USER,
                        pass: process.env.NODEMAILER_PASS
                    }
                   });

                   await transporter.sendMail({
                    from: "openHearing",
                    to,
                    subject,
                    text: body
                   });

                    console.log(`OTP email sent to ${to} successfully`);
                    channel.ack(message);
               }
           })
    }catch(error){
        console.log("Error in starting Consumer", error);
        process.exit(1);
    }
}

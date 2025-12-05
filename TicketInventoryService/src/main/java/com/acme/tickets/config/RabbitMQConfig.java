package com.acme.tickets.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration RabbitMQ pour la communication asynchrone entre microservices.
 * 
 * Cette configuration définit :
 * - Queue pour recevoir les statuts de paiement du PaymentService
 * - Exchange et routing keys pour le routage des messages
 * - Convertisseur JSON pour la sérialisation des messages
 */
@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queue.payment-status:payment-status}")
    private String paymentStatusQueue;

    @Value("${rabbitmq.exchange.payment:payment-exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.routing-key.payment:payment.status}")
    private String paymentRoutingKey;

    /**
     * Déclare la queue pour recevoir les notifications de statut de paiement.
     * La queue est durable (survit aux redémarrages du broker).
     */
    @Bean
    public Queue paymentStatusQueue() {
        return QueueBuilder.durable(paymentStatusQueue).build();
    }

    /**
     * Déclare la queue 'payment' utilisée par le PaymentService PHP.
     * Cette queue correspond à celle déclarée dans PaymentService.php
     */
    @Bean
    public Queue paymentQueue() {
        return QueueBuilder.durable("payment").build();
    }

    /**
     * Déclare un exchange de type Direct pour le routage des messages de paiement.
     */
    @Bean
    public DirectExchange paymentExchange() {
        return new DirectExchange(paymentExchange);
    }

    /**
     * Lie la queue payment-status à l'exchange avec la routing key.
     */
    @Bean
    public Binding paymentStatusBinding(Queue paymentStatusQueue, DirectExchange paymentExchange) {
        return BindingBuilder
                .bind(paymentStatusQueue)
                .to(paymentExchange)
                .with(paymentRoutingKey);
    }

    /**
     * Convertisseur JSON pour sérialiser/désérialiser les messages.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configure le RabbitTemplate avec le convertisseur JSON.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}

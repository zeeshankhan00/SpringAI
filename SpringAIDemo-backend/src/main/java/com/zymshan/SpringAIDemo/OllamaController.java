package com.zymshan.SpringAIDemo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ResponseEntity;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@CrossOrigin("*")
public class OllamaController {

    private ChatClient chatClient;

    public OllamaController(OllamaChatModel chatModel){
        this.chatClient = ChatClient.create(chatModel);
    }

    @PostMapping(value = "api/chat", produces= MediaType.TEXT_PLAIN_VALUE)
    public Flux<String> getAnswer(@RequestBody Map<String,String> body){
        return chatClient.prompt(body.get("prompt")).stream().content();
    }
}

package com.skillmentor.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfigs {
    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Skill Mentor Api")
                        .version("V.0.0.1")
                        .description("Test API Document")
                        .contact(new Contact()
                                .name("System Admin")
                                .email("janidudev@gmail.com")
                                .url("astravya.lk")
                        )
                );
    }

}

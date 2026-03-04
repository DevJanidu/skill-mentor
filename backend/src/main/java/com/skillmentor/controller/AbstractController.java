package com.skillmentor.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;



public class AbstractController {
    // reusable methods and logic

    protected <T> ResponseEntity<T> sendOkResponse(T response){

        return  ResponseEntity.ok(response);
    }

    protected  <T> ResponseEntity<T> sendCreatedAtResponse(T response){
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    protected <T> ResponseEntity<T>  sendNotFoundResponse(){

        return ResponseEntity.notFound().build();
    }

    protected <T> ResponseEntity<T>  sendNoContentResponse(){

        return ResponseEntity.noContent().build();
    }
}

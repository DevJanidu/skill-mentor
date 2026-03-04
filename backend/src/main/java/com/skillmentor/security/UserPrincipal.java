package com.skillmentor.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserPrincipal {
    private String id;          // User ID from Clerk (e.g., user_2abc123)
    private String email;       // User's email
    private String firstName;   // User's first name
    private String lastName;    // User's last name
    private String fullName;
    private String imgUrl;
}

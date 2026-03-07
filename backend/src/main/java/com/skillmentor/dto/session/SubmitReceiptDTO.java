package com.skillmentor.dto.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubmitReceiptDTO {

    @NotBlank(message = "Receipt URL is required")
    @Size(max = 500, message = "Receipt URL must be at most 500 characters")
    private String receiptUrl;
}

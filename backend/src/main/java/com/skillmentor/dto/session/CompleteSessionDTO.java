package com.skillmentor.dto.session;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CompleteSessionDTO {

    @Size(max = 2000, message = "Session notes must be at most 2000 characters")
    private String sessionNotes;
}

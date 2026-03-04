package com.skillmentor.service;

import com.skillmentor.dto.mentor.CreateMentorDTO;
import com.skillmentor.dto.mentor.MentorDTO;
import com.skillmentor.dto.mentor.UpdateMentorDTO;



import java.util.List;


public interface MentorService {
    List<MentorDTO> getAllMentors();
    MentorDTO getMentorById(Long id);
    MentorDTO createMentor(CreateMentorDTO dto,String clerkId);
    MentorDTO updateMentor(Long id, UpdateMentorDTO dto);
    void deleteMentor(Long id);
}

package com.skillmentor.service.impl;

import com.skillmentor.dto.PagedResponse;
import com.skillmentor.dto.mentor.CreateMentorDTO;
import com.skillmentor.dto.mentor.MentorDTO;
import com.skillmentor.dto.mentor.UpdateMentorDTO;
import com.skillmentor.entity.Mentor;
import com.skillmentor.entity.User;
import com.skillmentor.entity.UserRole;
import com.skillmentor.exception.SkillMentorException;
import com.skillmentor.mapper.MentorMapper;
import com.skillmentor.repository.MentorRepository;
import com.skillmentor.service.CloudinaryService;
import com.skillmentor.service.MentorService;
import com.skillmentor.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentorServiceImpl implements MentorService {

    private final MentorRepository mentorRepository;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public List<MentorDTO> getAllMentors() {
        log.debug("Fetching all mentors");

        List<Mentor> mentors = mentorRepository.findAll();
        return mentors.stream()
                .map(MentorMapper::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<MentorDTO> searchMentors(String name, String profession, Pageable pageable) {
        log.debug("Searching mentors — name={}, profession={}, page={}", name, profession, pageable);

        Page<Mentor> page = mentorRepository.searchMentors(
                name != null && name.isBlank() ? null : name,
                profession != null && profession.isBlank() ? null : profession,
                pageable
        );

        return PagedResponse.<MentorDTO>builder()
                .content(page.getContent().stream().map(MentorMapper::toDto).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MentorDTO getMentorById(Long id) {
        log.debug("Fetching mentor with id {}", id);

        Mentor mentor = mentorRepository.findById(id)
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + id,
                        HttpStatus.NOT_FOUND
                ));

        return MentorMapper.toDto(mentor);
    }

    @Override
    @Transactional
    public MentorDTO createMentor(CreateMentorDTO dto, String clerkId) {
        log.info("Creating mentor profile for user with Clerk ID: {}", clerkId);
        try {

            User user = userService.getUserEntityByClerkId(clerkId);

            if(user.getMentor() != null){
                log.warn("User {} already has a mentor profile", clerkId);
                throw new SkillMentorException(
                        "User already has a mentor profile",
                        HttpStatus.CONFLICT
                );
            }

            if (!user.getRoles().contains(UserRole.MENTOR)) {
                log.warn("User {} does not have MENTOR role", clerkId);
                throw new SkillMentorException(
                        "User does not have MENTOR role. Please complete onboarding first.",
                        HttpStatus.FORBIDDEN
                );
            }

            Mentor mentor = MentorMapper.toEntity(dto,user);
            Mentor savedMentor = mentorRepository.save(mentor);

            log.info("Mentor profile created successfully for user: {}", user.getEmail());
            return MentorMapper.toDto(savedMentor);

        } catch (DataIntegrityViolationException ex) {
            log.warn("Duplicate or invalid mentor data", ex);
            throw new SkillMentorException(
                    "Email already exists or invalid mentor data",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @Override
    @Transactional
    public MentorDTO updateMentor(Long id, UpdateMentorDTO dto) {
        log.debug("Updating mentor with id {}", id);

        try {
            Mentor mentor = mentorRepository.findById(id)
                    .orElseThrow(() -> new SkillMentorException(
                            "Mentor not found with id " + id,
                            HttpStatus.NOT_FOUND
                    ));

            Mentor updatedMentor = MentorMapper.updateMentor(mentor, dto);
            Mentor savedMentor = mentorRepository.save(updatedMentor);
            log.info("Mentor updated successfully: {}", id);
            return MentorMapper.toDto(savedMentor);

        } catch (SkillMentorException ex) {
            throw ex; // preserve correct status + message
        } catch (Exception ex) {
            log.error("Unexpected error updating mentor {}", id, ex);
            throw new SkillMentorException(
                    "Internal server error while updating mentor",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    @Transactional
    public void deleteMentor(Long id) {
        try{

            User user = userService.getUserByMentorId(id);

            log.debug("related suer for mentor id {} is {}",id,user.getClerkId());
            log.debug("Deleting mentor with id {}", id);

            Mentor mentor = mentorRepository.findById(id)
                    .orElseThrow(() -> new SkillMentorException(
                            "Mentor not found with id " + id,
                            HttpStatus.NOT_FOUND
                    ));

            mentorRepository.deleteById(id);
            userService.deleteUser(user.getClerkId());
            log.info("Mentor deleted successfully: {}", id);
            log.info("User deleted successfully: {}", user.getClerkId());
        }catch (SkillMentorException e){
            throw e;
        }catch (Exception e){
            log.error("Unexpected error deleting mentor {}", id, e);
            throw new SkillMentorException(
                    "Internal server error while deleting mentor",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    @Transactional
    public MentorDTO uploadProfileImage(Long mentorId, MultipartFile file) {
        log.debug("Uploading profile image for mentor {}", mentorId);

        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new SkillMentorException(
                        "Mentor not found with id " + mentorId, HttpStatus.NOT_FOUND));

        String secureUrl = cloudinaryService.uploadUnsigned(file, "mentors");
        mentor.getUser().setProfileImageUrl(secureUrl);

        log.info("Profile image uploaded for mentor {} → {}", mentorId, secureUrl);
        return MentorMapper.toDto(mentor);
    }
}

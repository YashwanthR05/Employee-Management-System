package com.employee.management.auth;

import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository resetRepo;

    public AuthController(AuthenticationManager authManager,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          PasswordResetTokenRepository resetRepo) {
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.resetRepo = resetRepo;
    }

    // ---------------- REGISTER ----------------
    @PostMapping("/register")
    public String register(@RequestBody SignupRequest req) {

        String username = req.getUsername() == null ? "" : req.getUsername().trim();
        String password = req.getPassword() == null ? "" : req.getPassword().trim();

        if (username.isEmpty()) return "username is required";
        if (password.length() < 6) return "password must be at least 6 characters";
        if (userRepository.existsByUsername(username)) return "username already exists";

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("USER");

        userRepository.save(user);
        return "Signup successful ✅";
    }

    // ---------------- LOGIN ----------------
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {

        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getUsername(),
                        req.getPassword()
                )
        );

        String token = jwtUtil.generateToken(auth.getName());
        return new LoginResponse(token);
    }

    // ---------------- FORGOT PASSWORD ----------------
    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody ForgotPasswordRequest req) {

        String username = req.getUsername() == null ? "" : req.getUsername().trim();
        if (username.isEmpty()) return "username is required";

        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setToken(UUID.randomUUID().toString());
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        prt.setUsed(false);

        resetRepo.save(prt);

        // In real world: send via email
        return "Reset token (valid 15 mins): " + prt.getToken();
    }

    // ---------------- RESET PASSWORD ----------------
    @PostMapping("/reset-password")
    public String resetPassword(@RequestBody ResetPasswordRequest req) {

        String token = req.getToken() == null ? "" : req.getToken().trim();
        String newPassword = req.getNewPassword() == null ? "" : req.getNewPassword().trim();

        if (token.isEmpty()) return "token is required";
        if (newPassword.length() < 6) return "newPassword must be at least 6 characters";

        PasswordResetToken prt = resetRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (prt.isUsed()) return "Token already used";
        if (prt.getExpiresAt().isBefore(LocalDateTime.now())) return "Token expired";

        AppUser user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        resetRepo.save(prt);

        return "Password reset successful ✅ Now login with new password.";
    }
}

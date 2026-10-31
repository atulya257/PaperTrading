package com.tradelab.userservice;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API of the User Service. Every response uses UserResponse, so a password hash never leaves the service.
 * The React app (port 5173) is allowed to call it from the browser.
 */
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers().stream().map(UserResponse::of).toList();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return UserResponse.of(userService.getUser(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerUser(@RequestBody RegisterRequest request) {
        return UserResponse.of(userService.registerUser(request));
    }

    @PostMapping("/login")
    public UserResponse loginUser(@RequestBody LoginRequest request) {
        return UserResponse.of(userService.loginUser(request));
    }
}

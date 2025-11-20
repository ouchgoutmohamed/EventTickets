package com.project.eventcatalogservice.security;

import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;

@Data
public class CustomUserDetails implements UserDetails {

    private Long organizerId;
    private String email;
    private String role;

    public CustomUserDetails(Long organizerId, String email, String role) {
        this.organizerId = organizerId;
        this.email = email;
        this.role = role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null; // ou mapper les rôles si tu veux gérer Admin/Organizer
    }

    @Override
    public String getPassword() {
        return null; // pas nécessaire ici
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}

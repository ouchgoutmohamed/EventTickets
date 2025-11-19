package com.project.eventcatalogservice.security;

import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
public class CustomUserDetails implements UserDetails {

    private Long userId;
    private String email;
    private Long organizerId;
    private Long roleId;      // ID du rôle
    private String roleName;
    private Collection<? extends GrantedAuthority> authorities;


    public CustomUserDetails(Long userId, String email, Long organizerId, Long roleId, String roleName) {
        this.userId = userId;
        this.email = email;
        this.organizerId = organizerId;
        this.roleId = roleId;
        this.roleName = roleName;
        this.authorities = List.of(() -> roleName);


    }


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null; // Pas nécessaire ici
    }

    @Override
    public String getUsername() {
        return email != null ? email : "";
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

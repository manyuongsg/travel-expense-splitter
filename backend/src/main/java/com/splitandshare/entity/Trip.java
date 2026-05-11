package com.splitandshare.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 3)
    private String baseCurrency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TripMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Expense> expenses = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean archived = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Trip() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public List<TripMember> getMembers() { return members; }
    public void setMembers(List<TripMember> members) { this.members = members; }
    public List<Expense> getExpenses() { return expenses; }
    public void setExpenses(List<Expense> expenses) { this.expenses = expenses; }
    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String name;
        private String baseCurrency;
        private User createdBy;

        public Builder name(String name) { this.name = name; return this; }
        public Builder baseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }

        public Trip build() {
            Trip t = new Trip();
            t.name = name;
            t.baseCurrency = baseCurrency;
            t.createdBy = createdBy;
            t.members = new ArrayList<>();
            t.expenses = new ArrayList<>();
            return t;
        }
    }
}

package com.voyage.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_member_id", nullable = false)
    private TripMember paidBy;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 19, scale = 0)
    private BigDecimal amountCents;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SplitType splitType;

    @Enumerated(EnumType.STRING)
    @Column
    private Category category = Category.OTHER;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseSplit> splits = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Expense() {}

    public enum SplitType {
        EQUAL, CUSTOM
    }

    public enum Category {
        FOOD, TRANSPORT, ACCOMMODATION, ACTIVITIES, SHOPPING, HEALTH, OTHER
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public TripMember getPaidBy() { return paidBy; }
    public void setPaidBy(TripMember paidBy) { this.paidBy = paidBy; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmountCents() { return amountCents; }
    public void setAmountCents(BigDecimal amountCents) { this.amountCents = amountCents; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public SplitType getSplitType() { return splitType; }
    public void setSplitType(SplitType splitType) { this.splitType = splitType; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public List<ExpenseSplit> getSplits() { return splits; }
    public void setSplits(List<ExpenseSplit> splits) { this.splits = splits; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Trip trip;
        private TripMember paidBy;
        private String description;
        private BigDecimal amountCents;
        private String currency;
        private BigDecimal exchangeRate;
        private SplitType splitType;
        private Category category = Category.OTHER;

        public Builder trip(Trip trip) { this.trip = trip; return this; }
        public Builder paidBy(TripMember paidBy) { this.paidBy = paidBy; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder amountCents(BigDecimal amountCents) { this.amountCents = amountCents; return this; }
        public Builder currency(String currency) { this.currency = currency; return this; }
        public Builder exchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; return this; }
        public Builder splitType(SplitType splitType) { this.splitType = splitType; return this; }
        public Builder category(Category category) { this.category = category; return this; }

        public Expense build() {
            Expense e = new Expense();
            e.trip = trip;
            e.paidBy = paidBy;
            e.description = description;
            e.amountCents = amountCents;
            e.currency = currency;
            e.exchangeRate = exchangeRate;
            e.splitType = splitType;
            e.category = category;
            e.splits = new ArrayList<>();
            return e;
        }
    }
}

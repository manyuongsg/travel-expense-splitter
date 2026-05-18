package com.voyage.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "expense_splits")
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owed_by_member_id", nullable = false)
    private TripMember owedBy;

    @Column(nullable = false, precision = 19, scale = 0)
    private BigDecimal shareAmountCents;

    @Column(nullable = false)
    private boolean settled = false;

    public ExpenseSplit() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Expense getExpense() { return expense; }
    public void setExpense(Expense expense) { this.expense = expense; }
    public TripMember getOwedBy() { return owedBy; }
    public void setOwedBy(TripMember owedBy) { this.owedBy = owedBy; }
    public BigDecimal getShareAmountCents() { return shareAmountCents; }
    public void setShareAmountCents(BigDecimal shareAmountCents) { this.shareAmountCents = shareAmountCents; }
    public boolean isSettled() { return settled; }
    public void setSettled(boolean settled) { this.settled = settled; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Expense expense;
        private TripMember owedBy;
        private BigDecimal shareAmountCents;

        public Builder expense(Expense expense) { this.expense = expense; return this; }
        public Builder owedBy(TripMember owedBy) { this.owedBy = owedBy; return this; }
        public Builder shareAmountCents(BigDecimal shareAmountCents) { this.shareAmountCents = shareAmountCents; return this; }

        public ExpenseSplit build() {
            ExpenseSplit s = new ExpenseSplit();
            s.expense = expense;
            s.owedBy = owedBy;
            s.shareAmountCents = shareAmountCents;
            s.settled = false;
            return s;
        }
    }
}

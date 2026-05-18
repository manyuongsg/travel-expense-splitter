package com.voyage.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public class ExpenseRequest {

    @NotBlank private String description;
    @NotNull @Min(1) private Long amountCents;
    @NotBlank @Size(min = 3, max = 3) private String currency;
    @NotBlank private String paidByMemberId;
    @NotNull private String splitType;
    private String category;
    private BigDecimal exchangeRate;
    private List<SplitEntry> customSplits;

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getAmountCents() { return amountCents; }
    public void setAmountCents(Long amountCents) { this.amountCents = amountCents; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getPaidByMemberId() { return paidByMemberId; }
    public void setPaidByMemberId(String paidByMemberId) { this.paidByMemberId = paidByMemberId; }
    public String getSplitType() { return splitType; }
    public void setSplitType(String splitType) { this.splitType = splitType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public List<SplitEntry> getCustomSplits() { return customSplits; }
    public void setCustomSplits(List<SplitEntry> customSplits) { this.customSplits = customSplits; }

    public static class SplitEntry {
        @NotBlank private String memberId;
        @NotNull @Min(0) private Long amountCents;

        public String getMemberId() { return memberId; }
        public void setMemberId(String memberId) { this.memberId = memberId; }
        public Long getAmountCents() { return amountCents; }
        public void setAmountCents(Long amountCents) { this.amountCents = amountCents; }
    }
}

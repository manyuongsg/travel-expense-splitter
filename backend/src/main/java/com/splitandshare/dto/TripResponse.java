package com.splitandshare.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TripResponse {
    private String id;
    private String name;
    private String baseCurrency;
    private LocalDateTime createdAt;
    private int memberCount;
    private long totalAmountCents;
    private List<MemberDto> members;
    private boolean archived;

    public TripResponse(String id, String name, String baseCurrency, LocalDateTime createdAt,
                        int memberCount, long totalAmountCents, List<MemberDto> members, boolean archived) {
        this.id = id;
        this.name = name;
        this.baseCurrency = baseCurrency;
        this.createdAt = createdAt;
        this.memberCount = memberCount;
        this.totalAmountCents = totalAmountCents;
        this.members = members;
        this.archived = archived;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }
    public long getTotalAmountCents() { return totalAmountCents; }
    public void setTotalAmountCents(long totalAmountCents) { this.totalAmountCents = totalAmountCents; }
    public List<MemberDto> getMembers() { return members; }
    public void setMembers(List<MemberDto> members) { this.members = members; }
    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public static class MemberDto {
        private String id;
        private String name;
        private String linkedUserId;

        public MemberDto(String id, String name, String linkedUserId) {
            this.id = id;
            this.name = name;
            this.linkedUserId = linkedUserId;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getLinkedUserId() { return linkedUserId; }
        public void setLinkedUserId(String linkedUserId) { this.linkedUserId = linkedUserId; }
    }
}

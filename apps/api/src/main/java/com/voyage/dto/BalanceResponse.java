package com.voyage.dto;

import java.util.List;

public class BalanceResponse {
    private List<MemberBalance> memberBalances;
    private List<Settlement> settlements;

    public BalanceResponse(List<MemberBalance> memberBalances, List<Settlement> settlements) {
        this.memberBalances = memberBalances;
        this.settlements = settlements;
    }

    public List<MemberBalance> getMemberBalances() { return memberBalances; }
    public void setMemberBalances(List<MemberBalance> memberBalances) { this.memberBalances = memberBalances; }
    public List<Settlement> getSettlements() { return settlements; }
    public void setSettlements(List<Settlement> settlements) { this.settlements = settlements; }

    public static class MemberBalance {
        private UserDto user;
        private long netAmountCents;

        public MemberBalance(UserDto user, long netAmountCents) {
            this.user = user;
            this.netAmountCents = netAmountCents;
        }

        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
        public long getNetAmountCents() { return netAmountCents; }
        public void setNetAmountCents(long netAmountCents) { this.netAmountCents = netAmountCents; }
    }

    public static class Settlement {
        private UserDto fromUser;
        private UserDto toUser;
        private long amountCents;

        public Settlement(UserDto fromUser, UserDto toUser, long amountCents) {
            this.fromUser = fromUser;
            this.toUser = toUser;
            this.amountCents = amountCents;
        }

        public UserDto getFromUser() { return fromUser; }
        public void setFromUser(UserDto fromUser) { this.fromUser = fromUser; }
        public UserDto getToUser() { return toUser; }
        public void setToUser(UserDto toUser) { this.toUser = toUser; }
        public long getAmountCents() { return amountCents; }
        public void setAmountCents(long amountCents) { this.amountCents = amountCents; }
    }

    public static class UserDto {
        private String id;
        private String displayName;
        private String linkedUserId;

        public UserDto(String id, String displayName, String linkedUserId) {
            this.id = id;
            this.displayName = displayName;
            this.linkedUserId = linkedUserId;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getLinkedUserId() { return linkedUserId; }
        public void setLinkedUserId(String linkedUserId) { this.linkedUserId = linkedUserId; }
    }
}

package com.splitandshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TripRequest {

    public static class Create {
        @NotBlank private String name;
        @NotBlank @Size(min = 3, max = 3) private String baseCurrency;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getBaseCurrency() { return baseCurrency; }
        public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    }

    public static class AddMember {
        @NotBlank private String name;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class Archive {
        private boolean archived;

        public boolean isArchived() { return archived; }
        public void setArchived(boolean archived) { this.archived = archived; }
    }

    public static class Update {
        @NotBlank private String name;
        @NotBlank @Size(min = 3, max = 3) private String baseCurrency;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getBaseCurrency() { return baseCurrency; }
        public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    }
}

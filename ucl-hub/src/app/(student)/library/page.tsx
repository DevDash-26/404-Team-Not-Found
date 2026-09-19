"use client";

import { CategoryServicesPage } from "@/features/services/components/CategoryServicesPage";

export default function LibraryPage() {
  return (
    <CategoryServicesPage
      title="Library"
      description="Opening hours, study spaces, borrowing and research help."
      category="library"
      faqCategory="general"
      askAi={["What time does the library close?", "How do I book a study room?"]}
    />
  );
}

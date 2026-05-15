"use client";

import { useCallback, useState, useMemo } from "react";
import NewOccurrenceModal from "./components/new-occurrence-modal";
import { Occurrence } from "./types";

import useSWR from "swr";
import { fetcher } from "@/app/mocks/mocks-utils";

function OccurrencesPage() {
  //TODO const { data, error } = useSWR("/api/occurrences", fetcher);

  const mockOccurrences = useMemo(() => [] as Occurrence[], []);

  const [isNewOccurrenceModalOpen, setIsNewOccurrenceModalOpen] =
    useState(false);

  const handleModalClose = useCallback(
    () => setIsNewOccurrenceModalOpen(false),
    [],
  );

  const handleAddNewOccurrence = useCallback(
    (occurrence: Occurrence) => [...mockOccurrences, occurrence],
    [mockOccurrences],
  );

  return (
    <div className="min-h-screen bg-background">
      {isNewOccurrenceModalOpen ? (
        <NewOccurrenceModal
          onClose={handleModalClose}
          onSave={handleAddNewOccurrence}
        />
      ) : null}
    </div>
  );
}

export default OccurrencesPage;

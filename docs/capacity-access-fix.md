# Capacity read access

19 October 2026: added a narrow binCapacities/{capacityId} rule in the configured named database (shining-display-s6tvw / ai-studio-bingosmartwastem-8bd3b03c-9b90-40c5-9a6b-f0a36a775d69). Signed-in get/list allowed; all browser writes remain denied. Unrelated live rules preserved. No sample documents created. Xiangwei capacity code is not present in the latest fetched branch ea23517; write-schema integration remains unreviewed. Capacity reads must start after Firebase Authentication is ready.

Follow-up: admin-managed capacity now permits create/update through existing isAdmin() checks; delete stays denied. Signed-in reads unchanged. No capacity schema was assumed because the feature code is not available yet. Existing admin UID and ordinary resident tested using Rules Playground, without writing sample capacity documents.

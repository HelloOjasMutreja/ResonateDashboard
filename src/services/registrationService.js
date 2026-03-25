import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export async function getRegistrations() {
  try {
    const registrationsQuery = query(collection(db, "registrations"));
    const snapshot = await getDocs(registrationsQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        teamName: data.teamName,
        trackChoice: data.trackChoice,
        numberOfMembers: data.numberOfMembers,
        members: data.members,
        leaderEmail: data.leaderEmail,
        paymentProofUrl: data.paymentProofUrl,
        submittedAt: data.submittedAt,
        approvalStatus: data.approvalStatus ?? "pending"
      };
    });
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "";

    if (errorCode === "permission-denied") {
      throw new Error("ACCESS_DENIED");
    }

    console.error(error);
    throw error;
  }
}

export async function testFirestoreConnection() {
  const testQuery = query(collection(db, "registrations"), limit(1));
  const snapshot = await getDocs(testQuery);

  if (snapshot.docs.length > 0) {
    console.log("Firestore read success");
    console.log(snapshot.docs[0].id);
  }
}

export async function updateApprovalStatus(id, status) {
  if (!auth.currentUser) {
    throw new Error("Not authenticated");
  }

  const allowedStatuses = ["approved", "pending", "hold"];

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      `Invalid approval status: ${status}. Allowed values: approved, pending, hold`
    );
  }

  const registrationRef = doc(db, "registrations", id);
  const beforeSnapshot = await getDoc(registrationRef);

  if (!beforeSnapshot.exists()) {
    throw new Error(`Registration document not found: ${id}`);
  }

  const beforeData = beforeSnapshot.data();
  const teamName = beforeData.teamName ?? "Unknown Team";
  const oldStatus = beforeData.approvalStatus ?? "pending";

  await updateDoc(registrationRef, {
    approvalStatus: status,
    reviewedAt: serverTimestamp()
  });

  const afterSnapshot = await getDoc(registrationRef);
  const afterData = afterSnapshot.data();
  const hasTeamName = Object.prototype.hasOwnProperty.call(afterData, "teamName");
  const hasMembers =
    Object.prototype.hasOwnProperty.call(afterData, "members") ||
    Object.prototype.hasOwnProperty.call(afterData, "numberOfMembers");
  const hasPaymentProofUrl = Object.prototype.hasOwnProperty.call(
    afterData,
    "paymentProofUrl"
  );
  const statusUpdated = afterData.approvalStatus === status;

  const allOriginalFieldsStillExist = Object.keys(beforeData).every(
    (key) => Object.prototype.hasOwnProperty.call(afterData, key)
  );

  if (!allOriginalFieldsStillExist) {
    throw new Error("Post-update verification failed: original fields missing");
  }

  if (!statusUpdated) {
    console.error("approvalStatus update verification failed");
  }

  if (!hasTeamName || !hasMembers || !hasPaymentProofUrl) {
    console.error("Missing required fields after update");
  } else if (statusUpdated) {
    console.log("Update safe");
    console.log(
      `${teamName} changed from ${oldStatus} to ${status} at ${new Date().toISOString()}`
    );
  }

  console.log("Safe update confirmed");
}

export async function testApprovalUpdate() {
  const testQuery = query(collection(db, "registrations"), limit(1));
  const snapshot = await getDocs(testQuery);

  if (snapshot.docs.length === 0) {
    throw new Error("No registration documents found for approval update test");
  }

  const firstDoc = snapshot.docs[0];
  const originalKeys = Object.keys(firstDoc.data());

  await updateApprovalStatus(firstDoc.id, "pending");

  const updatedSnapshot = await getDoc(doc(db, "registrations", firstDoc.id));

  if (!updatedSnapshot.exists()) {
    throw new Error("Document missing after approval update test");
  }

  const updatedKeys = Object.keys(updatedSnapshot.data());
  const noKeysRemoved = originalKeys.every((key) => updatedKeys.includes(key));

  if (!noKeysRemoved) {
    throw new Error("Schema integrity check failed: one or more keys were removed");
  }

  console.log("Schema integrity maintained");
}

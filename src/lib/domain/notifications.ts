import { notifications, contacts, groupMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function notifyTransactionDeleted(
  tx: any, // DB transaction context
  existingTx: any, // The deleted transaction record
  currentUser: { id: string; name?: string | null }
) {
  // Notify linked user if present (1:1 contact)
  if (existingTx.contactId) {
    const contactRow = await tx.query.contacts.findFirst({
      where: and(eq(contacts.id, existingTx.contactId), eq(contacts.userId, currentUser.id)),
    });
    if (contactRow?.linkedUserId) {
      await tx.insert(notifications).values({
        userId: contactRow.linkedUserId,
        type: "TRANSACTION_DELETED",
        title: "Transaction Deleted",
        message: `${currentUser.name || "A friend"} deleted a transaction: "${existingTx.name}"`,
        data: {
          transactionId: existingTx.id,
          deletedBy: currentUser.id,
        },
      });
    }
  }

  // Notify group members if it was a group transaction
  if (existingTx.groupId) {
    const members = await tx.query.groupMembers.findMany({
      where: and(eq(groupMembers.groupId, existingTx.groupId)),
    });
    for (const m of members) {
      if (m.userId && m.userId !== currentUser.id) {
        await tx.insert(notifications).values({
          userId: m.userId,
          type: "TRANSACTION_DELETED",
          title: "Group Transaction Deleted",
          message: `${currentUser.name || "A member"} deleted a transaction: "${existingTx.name}"`,
          data: {
            transactionId: existingTx.id,
            groupId: existingTx.groupId,
            deletedBy: currentUser.id,
          },
        });
      }
    }
  }
}

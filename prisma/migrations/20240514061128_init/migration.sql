-- CreateTable
CREATE TABLE "User" (
    "Line_user_Id" TEXT NOT NULL,
    "Line_user_Name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "request_highfive" TEXT NOT NULL,
    "reject_highfive" TEXT NOT NULL,
    "already_highfive" TEXT NOT NULL,
    "notyet_highfive" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Line_user_Id_key" ON "User"("Line_user_Id");

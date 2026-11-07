-- FreeTour 수동 마이그레이션 (Neon SQL Editor에서 실행)
-- 모든 문장은 여러 번 실행해도 안전합니다 (IF NOT EXISTS / 예외 처리).
-- 이미 실행한 부분은 건너뛰어도 됩니다.

-- 1. 포인트 사용 (픽업)
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "pointsUsed" INTEGER NOT NULL DEFAULT 0;

-- 2. 픽업 차량 정보
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "vehiclePlate" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "vehicleSeats" INTEGER;

-- 3. 자가 등록 파트너 + 자동 배정 + 수락 + 신고
ALTER TABLE "TransferPartner" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "TransferPartner_userId_key" ON "TransferPartner"("userId");
DO $$ BEGIN
  ALTER TABLE "TransferPartner" ADD CONSTRAINT "TransferPartner_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "TransferPartner"
  ADD COLUMN IF NOT EXISTS "businessNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "vehiclePlates" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "termsAgreedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PickupRequest"
  ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reportedAt" TIMESTAMP(3);

-- 4. 현지 체험 상품
CREATE TABLE IF NOT EXISTS "Experience" (
  "id" TEXT PRIMARY KEY,
  "guideId" TEXT NOT NULL REFERENCES "GuideProfile"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'TOUR',
  "durationHours" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KRW',
  "maxPeople" INTEGER NOT NULL DEFAULT 4,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'TOUR';
CREATE INDEX IF NOT EXISTS "Experience_country_city_idx" ON "Experience"("country", "city");
CREATE INDEX IF NOT EXISTS "Experience_guideId_idx" ON "Experience"("guideId");
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "experienceId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_experienceId_fkey"
    FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. 여행 중 호텔 이동
CREATE TABLE IF NOT EXISTS "HotelTransfer" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE,
  "travelerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "country" TEXT NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT NOT NULL,
  "rideAt" TIMESTAMP(3) NOT NULL,
  "passengers" INTEGER NOT NULL DEFAULT 1,
  "luggageCount" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "price" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PickupStatus" NOT NULL DEFAULT 'REQUESTED',
  "partnerId" TEXT REFERENCES "TransferPartner"("id") ON DELETE SET NULL,
  "acceptedAt" TIMESTAMP(3),
  "driverName" TEXT,
  "driverPhone" TEXT,
  "vehiclePlate" TEXT,
  "vehicleSeats" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "HotelTransfer_status_rideAt_idx" ON "HotelTransfer"("status", "rideAt");
CREATE INDEX IF NOT EXISTS "HotelTransfer_partnerId_idx" ON "HotelTransfer"("partnerId");
CREATE INDEX IF NOT EXISTS "HotelTransfer_bookingId_idx" ON "HotelTransfer"("bookingId");

-- 6. 예약 채팅
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "body" VARCHAR(1000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Message_bookingId_createdAt_idx" ON "Message"("bookingId", "createdAt");

-- 7. 예약 취소와 환불 기록
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT,
  ADD COLUMN IF NOT EXISTS "refundAmount" INTEGER NOT NULL DEFAULT 0;

-- 8. 긴급 알림 (SOS)
CREATE TABLE IF NOT EXISTS "Incident" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE,
  "reporterId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL DEFAULT 'SOS',
  "message" VARCHAR(500),
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "adminNote" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "Incident_status_createdAt_idx" ON "Incident"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Incident_bookingId_idx" ON "Incident"("bookingId");

-- 9. 가이드 연락처
ALTER TABLE "GuideProfile" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 10. 파트너 수수료와 정산액 (픽업·이동)
ALTER TABLE "PickupRequest"
  ADD COLUMN IF NOT EXISTS "platformFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "partnerPayout" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HotelTransfer"
  ADD COLUMN IF NOT EXISTS "platformFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "partnerPayout" INTEGER NOT NULL DEFAULT 0;

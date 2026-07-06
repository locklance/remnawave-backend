-- CreateTable
CREATE TABLE "public"."hosts_to_xray_json_templates" (
    "host_uuid" UUID NOT NULL,
    "template_uuid" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "hosts_to_xray_json_templates_pkey" PRIMARY KEY ("host_uuid","template_uuid")
);

-- AddForeignKey
ALTER TABLE "public"."hosts_to_xray_json_templates" ADD CONSTRAINT "hosts_to_xray_json_templates_host_uuid_fkey" FOREIGN KEY ("host_uuid") REFERENCES "public"."hosts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hosts_to_xray_json_templates" ADD CONSTRAINT "hosts_to_xray_json_templates_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "public"."subscription_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: fold each host's existing single xray-json template into the ordered
-- join table at position 0, preserving current behaviour for existing hosts.
INSERT INTO "public"."hosts_to_xray_json_templates" ("host_uuid", "template_uuid", "position")
SELECT "uuid", "xray_json_template_uuid", 0
FROM "public"."hosts"
WHERE "xray_json_template_uuid" IS NOT NULL;

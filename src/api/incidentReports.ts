import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import type { Incident, Shift } from "../../types";

export type InsertIncidentReportInput = {
  departmentId: string | null;
  reportedBy: string;
  title: string;
  body: string;
  severity: string;
  shift: Shift;
  attachmentUrls?: string[];
};

type IncidentReportRow = {
  id: string;
  title: string;
  body: string;
  severity: string;
  shift: number;
  department_id: string;
  reported_by: string;
  created_at: string;
  updated_at: string;
  attachment_urls: string[] | null;
};

type UploadPhotoInput = {
  uri: string;
  mimeType?: string | null;
};

const INCIDENT_PHOTO_BUCKET = "incident-report-photos";

function parseShift(v: number): Shift {
  if (v === 1) return "1勤";
  if (v === 2) return "2勤";
  if (v === 3) return "3勤";
  return "1勤";
}

function toShiftNumber(v: Shift): number {
  if (v === "1勤") return 1;
  if (v === "2勤") return 2;
  if (v === "3勤") return 3;
  return 1;
}

function mapRow(row: IncidentReportRow, reporterNameById: Record<string, string | null>): Incident {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    attachmentUrls: row.attachment_urls ?? [],
    severity: row.severity,
    shift: parseShift(row.shift),
    departmentId: row.department_id,
    reportedBy: row.reported_by,
    reporterName: reporterNameById[row.reported_by] ?? "不明",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function buildReporterNameById(rows: IncidentReportRow[]): Promise<Record<string, string | null>> {
  const reporterIds = Array.from(
    new Set(rows.map((row) => row.reported_by).filter((id): id is string => Boolean(id)))
  );

  const reporterNameById: Record<string, string | null> = {};
  if (reporterIds.length === 0) return reporterNameById;

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", reporterIds);

  if (profilesError) throw new Error(profilesError.message);

  for (const profile of profilesData ?? []) {
    reporterNameById[profile.id] = profile.display_name ?? null;
  }

  return reporterNameById;
}

function getContentTypeFromUri(uri: string): string {
  const lowerUri = uri.toLowerCase();

  if (lowerUri.endsWith(".png")) return "image/png";
  if (lowerUri.endsWith(".webp")) return "image/webp";
  if (lowerUri.endsWith(".heic")) return "image/heic";
  if (lowerUri.endsWith(".heif")) return "image/heif";

  return "image/jpeg";
}

function getFileExtensionFromContentType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic") return "heic";
  if (contentType === "image/heif") return "heif";
  if (contentType === "image/jpeg") return "jpg";

  return "jpg";
}

function resolveContentType(photo: UploadPhotoInput): string {
  return photo.mimeType ?? getContentTypeFromUri(photo.uri);
}

function normalizeLocalUri(uri: string): string {
  // Keep already-schemed URIs like file://, content://, ph:// as-is.
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(uri)) {
    return uri;
  }
  return `file://${uri}`;
}

export async function fetchIncidentReports(departmentId: string | null): Promise<Incident[]> {
  if (!departmentId) return [];

  const maxRows = 3;
  const { data, error } = await supabase
    .from("incident_reports")
    .select(`
      id,
      title,
      body,
      severity,
      shift,
      department_id,
      reported_by,
      created_at,
      updated_at,
      attachment_urls
    `)
    .eq("department_id", departmentId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(0, maxRows - 1);

  if (error) throw new Error(error.message);

  const rows = (data as IncidentReportRow[] | null) ?? [];
  const reporterNameById = await buildReporterNameById(rows);
  return rows.slice(0, maxRows).map((row) => mapRow(row, reporterNameById));
}

function sanitizeIncidentSearchToken(keyword: string): string {
  return keyword
    .trim()
    .replace(/[%_,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchIncidentReports(
  departmentId: string | null,
  keyword: string
): Promise<Incident[]> {
  if (!departmentId) return [];

  const token = sanitizeIncidentSearchToken(keyword);
  if (!token) return [];

  const pattern = `%${token}%`;

  const { data, error } = await supabase
    .from("incident_reports")
    .select(`
      id,
      title,
      body,
      severity,
      shift,
      department_id,
      reported_by,
      created_at,
      updated_at,
      attachment_urls
    `)
    .eq("department_id", departmentId)
    .is("deleted_at", null)
    .or(`title.ilike.${pattern},body.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);

  const rows = (data as IncidentReportRow[] | null) ?? [];
  const reporterNameById = await buildReporterNameById(rows);
  return rows.map((row) => mapRow(row, reporterNameById));
}

export async function insertIncidentReport(input: InsertIncidentReportInput): Promise<void> {
  if (!input.departmentId) {
    throw new Error("部署が未設定のため登録できません");
  }

  const normalizedAttachmentUrls = Array.from(
    new Set((input.attachmentUrls ?? []).filter((url) => typeof url === "string" && url.length > 0))
  ).slice(0, 3);

  const { error } = await supabase.from("incident_reports").insert({
    title: input.title.trim(),
    body: input.body.trim(),
    severity: input.severity,
    shift: toShiftNumber(input.shift),
    department_id: input.departmentId,
    reported_by: input.reportedBy,
    attachment_urls: normalizedAttachmentUrls,
  });

  if (error) throw new Error(error.message);
}

export async function deleteIncidentReport(params: {
  reportId: string;
  userId: string;
  role?: "admin" | "manager" | "member";
}): Promise<void> {
  const { reportId, userId, role } = params;
  const isAdmin = role === "admin";

  let query = supabase.from("incident_reports").update({
    deleted_at: new Date().toISOString(),
    deleted_by: userId,
  })
  .eq("id", reportId);
  if (!isAdmin) {
    query = query.eq("reported_by", userId);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function uploadIncidentPhotos(params: {
  departmentId: string;
  userId: string;
  photos: UploadPhotoInput[];
}): Promise<string[]> {
  const { departmentId, userId, photos } = params;
  if (!photos.length) return [];

  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i += 1) {
    const photo = photos[i];
    const { uri } = photo;

    const contentType = resolveContentType(photo);
    const extension = getFileExtensionFromContentType(contentType);
    const path = `${departmentId}/${userId}/${Date.now()}-${i}.${extension}`;

    const normalizedUri = normalizeLocalUri(uri);

    const file = new File(normalizedUri);
    const base64 = await file.base64();
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage
      .from(INCIDENT_PHOTO_BUCKET)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`画像アップロードに失敗しました: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(INCIDENT_PHOTO_BUCKET)
      .getPublicUrl(path);

    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}
























































































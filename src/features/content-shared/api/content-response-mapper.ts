import type { ContentDetail, ContentItem, PaginatedMeta } from "../types/content.type";

type ContentOfficerLike = {
  id: string;
  name: string;
  wilayah_id?: string | null;
  wilayah?: {
    id: string;
    nama: string;
    kode: string;
    level: string;
  } | null;
  regional?: string | null;
};

type ContentWithOfficer = Omit<ContentItem, "officer"> & {
  officer: ContentOfficerLike;
};

type ContentDetailWithOfficer = Omit<ContentDetail, "officer"> & {
  officer: ContentOfficerLike;
};

function mapOfficer(officer: ContentOfficerLike) {
  return {
    id: officer.id,
    name: officer.name,
    wilayah_id: officer.wilayah_id ?? null,
    regional: officer.regional ?? officer.wilayah?.nama ?? null,
  };
}

export function mapContentItem(item: ContentWithOfficer): ContentItem {
  return {
    ...item,
    officer: mapOfficer(item.officer),
  };
}

export function mapContentDetail(detail: ContentDetailWithOfficer): ContentDetail {
  return {
    ...detail,
    officer: mapOfficer(detail.officer),
  };
}

export function mapContentListResponse<TMeta = PaginatedMeta>(
  response: {
    success: boolean;
    data: ContentWithOfficer[];
    meta?: TMeta;
    message?: string;
    code?: string;
  },
) {
  return {
    ...response,
    data: response.data.map(mapContentItem),
  };
}

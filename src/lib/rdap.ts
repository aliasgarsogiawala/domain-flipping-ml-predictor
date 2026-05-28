export type RdapAvailabilityStatus = "Available" | "Taken" | "Unknown";

export type RdapLookupResult = {
  availabilityStatus: RdapAvailabilityStatus;
  registrar: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  statuses: string[];
};

type RdapEvent = {
  eventAction?: string;
  eventDate?: string;
};

type RdapEntity = {
  roles?: string[];
  vcardArray?: unknown[];
};

type RdapResponse = {
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
};

function getEventDate(
  events: RdapEvent[] | undefined,
  actions: string[],
): string | null {
  if (!events) {
    return null;
  }

  const match = events.find((event) => {
    const action = event.eventAction?.toLowerCase();
    return action ? actions.includes(action) : false;
  });

  return match?.eventDate ?? null;
}

function getRegistrarName(entities: RdapEntity[] | undefined): string | null {
  if (!entities) {
    return null;
  }

  const registrarEntity = entities.find((entity) =>
    entity.roles?.some((role) => role.toLowerCase() === "registrar"),
  );

  const vcardArray = registrarEntity?.vcardArray;
  if (!Array.isArray(vcardArray) || !Array.isArray(vcardArray[1])) {
    return null;
  }

  for (const field of vcardArray[1]) {
    if (!Array.isArray(field) || field[0] !== "fn") {
      continue;
    }

    const value = field[3];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function normalizeRdapPayload(payload: RdapResponse): Omit<RdapLookupResult, "availabilityStatus"> {
  return {
    registrar: getRegistrarName(payload.entities),
    createdAt: getEventDate(payload.events, ["registration"]),
    expiresAt: getEventDate(payload.events, ["expiration"]),
    updatedAt: getEventDate(payload.events, ["last changed", "last update of rdap database"]),
    statuses: Array.isArray(payload.status) ? payload.status : [],
  };
}

export async function lookupRDAP(domain: string): Promise<RdapLookupResult> {
  const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rdap+json, application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) {
      return {
        availabilityStatus: "Available",
        registrar: null,
        createdAt: null,
        expiresAt: null,
        updatedAt: null,
        statuses: [],
      };
    }

    if (response.status !== 200) {
      return {
        availabilityStatus: "Unknown",
        registrar: null,
        createdAt: null,
        expiresAt: null,
        updatedAt: null,
        statuses: [],
      };
    }

    const payload = (await response.json()) as RdapResponse;

    return {
      availabilityStatus: "Taken",
      ...normalizeRdapPayload(payload),
    };
  } catch {
    return {
      availabilityStatus: "Unknown",
      registrar: null,
      createdAt: null,
      expiresAt: null,
      updatedAt: null,
      statuses: [],
    };
  }
}

export async function getDomainAvailability(
  domain: string,
): Promise<RdapAvailabilityStatus> {
  const rdap = await lookupRDAP(domain);
  return rdap.availabilityStatus;
}

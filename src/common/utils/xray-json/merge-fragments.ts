/**
 * Merge several xray-json template fragments into a single xray config.
 *
 * Fragments are pre-defined pieces of an xray config (routing rules,
 * burstObservatory, extra outbounds, dns, policy, ...) attached to a host in an
 * ordered list. To avoid conflicts, same-level arrays are CONCATENATED (all
 * routing rules from every fragment are joined together, all outbounds joined,
 * etc.) rather than one fragment overwriting another. Everything else (plain
 * objects and scalars outside the whitelisted array sections) is deep-merged with
 * last-fragment-wins semantics, following the left-to-right order of the list.
 */

type JsonObject = Record<string, unknown>;

/**
 * Dot-paths whose array values are concatenated across fragments instead of being
 * replaced. Any array NOT listed here follows last-wins (later fragment replaces
 * the earlier one).
 */
const CONCAT_ARRAY_PATHS = new Set<string>([
    'outbounds',
    'inbounds',
    'routing.rules',
    'routing.balancers',
    'dns.servers',
    'observatory.subjectSelector',
    'burstObservatory.subjectSelector',
]);

function isPlainObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeInto(target: JsonObject, source: JsonObject, path: string): void {
    for (const key of Object.keys(source)) {
        const nextPath = path ? `${path}.${key}` : key;
        const sourceValue = source[key];
        const targetValue = target[key];

        if (Array.isArray(sourceValue)) {
            if (CONCAT_ARRAY_PATHS.has(nextPath)) {
                const base = Array.isArray(targetValue) ? targetValue : [];
                target[key] = [...base, ...sourceValue];
            } else {
                // Non-whitelisted array: last-wins.
                target[key] = [...sourceValue];
            }
            continue;
        }

        if (isPlainObject(sourceValue)) {
            if (!isPlainObject(targetValue)) {
                target[key] = {};
            }
            mergeInto(target[key] as JsonObject, sourceValue, nextPath);
            continue;
        }

        // Scalar (or null): last-wins.
        target[key] = sourceValue;
    }
}

function assertNoDuplicateTags(config: JsonObject): void {
    const collectTags = (section: unknown, label: string): void => {
        if (!Array.isArray(section)) {
            return;
        }
        const seen = new Set<string>();
        for (const entry of section) {
            if (!isPlainObject(entry) || typeof entry.tag !== 'string') {
                continue;
            }
            if (seen.has(entry.tag)) {
                throw new Error(
                    `Duplicate ${label} tag "${entry.tag}" produced by merging xray-json fragments`,
                );
            }
            seen.add(entry.tag);
        }
    };

    collectTags(config.outbounds, 'outbound');
    if (isPlainObject(config.routing)) {
        collectTags(config.routing.balancers, 'routing balancer');
    }
}

/**
 * Fold an ordered list of xray-json fragments into one config.
 *
 * @throws Error if two fragments produce a duplicate outbound / balancer tag.
 */
export function mergeXrayJsonFragments<T extends JsonObject = JsonObject>(fragments: T[]): T {
    const result: JsonObject = {};

    for (const fragment of fragments) {
        if (!isPlainObject(fragment)) {
            continue;
        }
        mergeInto(result, fragment, '');
    }

    assertNoDuplicateTags(result);

    return result as T;
}

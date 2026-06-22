import { BASE_URL } from '../constant/url';
import { GETNETWORK } from './Network';

const extractCategories = (result) => {
  if (Array.isArray(result?.categories)) return result.categories;
  if (Array.isArray(result?.data?.categories)) return result.data.categories;
  if (result?.success && Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
};

const extractSubcategories = (result) => {
  if (Array.isArray(result?.subcategories)) return result.subcategories;
  if (Array.isArray(result?.data?.subcategories)) return result.data.subcategories;
  if (result?.success && Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
};

const toId = (value) => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const normalizeList = (items, ids, singleId) => {
  if (Array.isArray(items) && items.length) {
    return items
      .map((item) => {
        if (item == null) return null;
        if (typeof item === 'string' || typeof item === 'number') {
          const id = toId(item);
          return id != null ? { id, name: String(item) } : null;
        }
        const id = toId(item.id ?? item._id ?? item.category_id ?? item.subcategory_id);
        const name = item.name ?? item.label ?? item.title ?? '';
        return id != null || name ? { id, name } : null;
      })
      .filter(Boolean);
  }

  const idList = Array.isArray(ids)
    ? ids
    : singleId != null && singleId !== ''
      ? [singleId]
      : [];

  return idList
    .map((id) => {
      const normalized = toId(id);
      return normalized != null ? { id: normalized, name: '' } : null;
    })
    .filter(Boolean);
};

export const extractCategoryPreferences = (user = {}) => {
  const categories = normalizeList(
    user.categories || user.selectedCategories,
    user.categoryIds,
    user.categoryId
  );
  const subcategories = normalizeList(
    user.subcategories || user.selectedSubcategories,
    user.subcategoryIds,
    user.subcategoryId
  );

  return {
    categories,
    subcategories,
    categoryIds: categories.map((c) => c.id).filter((id) => id != null),
    subcategoryIds: subcategories.map((s) => s.id).filter((id) => id != null),
  };
};

export const formatCategoryPreferenceNames = (items = []) => {
  if (!items.length) return 'N/A';
  return items
    .map((item) => item?.name || (item?.id != null ? `ID ${item.id}` : ''))
    .filter(Boolean)
    .join(', ');
};

export const resolveCategoryPreferenceLabels = async (prefs) => {
  const categories = [...(prefs?.categories || [])];
  const subcategories = [...(prefs?.subcategories || [])];

  try {
    const catRes = await GETNETWORK(`${BASE_URL}categories/categories`, false);
    const allCats = extractCategories(catRes);
    const catMap = new Map(allCats.map((c) => [Number(c.id), c.name]));

    categories.forEach((item, index) => {
      if (!item.name && item.id != null) {
        categories[index] = {
          ...item,
          name: catMap.get(Number(item.id)) || `Category #${item.id}`,
        };
      }
    });

    const parentCategoryId = categories[0]?.id;
    if (parentCategoryId && subcategories.some((s) => !s.name)) {
      const subRes = await GETNETWORK(
        `${BASE_URL}categories/categories/${parentCategoryId}/subcategories`,
        false
      );
      const allSubs = extractSubcategories(subRes);
      const subMap = new Map(allSubs.map((s) => [Number(s.id), s.name]));

      subcategories.forEach((item, index) => {
        if (!item.name && item.id != null) {
          subcategories[index] = {
            ...item,
            name: subMap.get(Number(item.id)) || `Subcategory #${item.id}`,
          };
        }
      });
    } else {
      subcategories.forEach((item, index) => {
        if (!item.name && item.id != null) {
          subcategories[index] = { ...item, name: `Subcategory #${item.id}` };
        }
      });
    }
  } catch (error) {
    // Keep IDs if lookup fails
  }

  return {
    categories,
    subcategories,
    categoryIds: categories.map((c) => c.id).filter((id) => id != null),
    subcategoryIds: subcategories.map((s) => s.id).filter((id) => id != null),
  };
};

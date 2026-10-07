import { propNames } from "../propNames";

export const isElHasProperty = (el: HTMLElement, property: string) => {
  return el.getAttribute(propNames.dataAttr)?.includes(property) ?? false;
};

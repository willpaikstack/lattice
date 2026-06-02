export type CurrentUser = {
  name: string;
  email: string;
};

export const currentUser: CurrentUser = {
  name: "William Paik",
  email: "will@latticeos.co",
};

export function initialsForName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

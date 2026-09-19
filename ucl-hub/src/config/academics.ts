/**
 * Faculty / programme structure used for profiles and announcement targeting.
 * In production this would come from the student records system; the brief
 * states that such systems are not available, so it is a maintained constant.
 */

export interface Faculty {
  id: string;
  name: string;
  programmes: string[];
}

export const FACULTIES: readonly Faculty[] = [
  {
    id: "computing",
    name: "Computing",
    programmes: ["Software Engineering", "Data Science", "Cyber Security", "Information Systems"],
  },
  {
    id: "business",
    name: "Business",
    programmes: ["Business Management", "Accounting & Finance", "Marketing"],
  },
  {
    id: "engineering",
    name: "Engineering",
    programmes: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"],
  },
] as const;

export const YEARS = [1, 2, 3, 4] as const;

export const ALL_PROGRAMMES: readonly string[] = FACULTIES.flatMap((f) => f.programmes);

export function facultyById(id: string): Faculty | undefined {
  return FACULTIES.find((f) => f.id === id);
}

export function facultyOfProgramme(programme: string): Faculty | undefined {
  return FACULTIES.find((f) => f.programmes.includes(programme));
}

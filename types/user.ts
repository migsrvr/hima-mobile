export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type Session = {
  token: string;
  user: User;
};

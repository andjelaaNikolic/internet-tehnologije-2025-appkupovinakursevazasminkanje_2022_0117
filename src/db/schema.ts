import { integer, numeric, pgEnum, pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const ulogaEnum = pgEnum("uloga", [
  "ADMIN",
  "KLIJENT",
  "EDUKATOR",
]);

export const korisnik = pgTable("korisnik", {
  id: uuid("id").primaryKey().defaultRandom(),
  ime: varchar("ime", { length: 100 }).notNull(),
  prezime: varchar("prezime", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  lozinka: varchar("lozinka", { length: 255 }).notNull(),
  uloga: ulogaEnum("uloga").notNull(),
  datumRegistracije: timestamp("datum_registracije").defaultNow().notNull(),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true, mode: "date" }),
});

export const kurs = pgTable("kurs", {
  id: uuid("id").primaryKey().defaultRandom(),
  naziv: varchar("naziv", { length: 150 }).notNull().unique(),
  opis: varchar("opis", { length: 1000 }).notNull(),
  cena: numeric("cena", { precision: 10, scale: 2 }).notNull(),
  kategorija: varchar("kategorija", { length: 100 }).notNull(),
  slika: varchar("slika", { length: 1000 }).notNull(),
  edukator: uuid("edukator_id").references(() => korisnik.id).notNull(),
});

export const videoLekcija = pgTable("video_lekcija", {
  id: uuid("id").primaryKey().defaultRandom(),
  naziv: varchar("naziv", { length: 150 }).notNull(),
  trajanje: numeric("trajanje").notNull(),
  opis: varchar("opis", { length: 1000 }).notNull(),
  video: varchar("video", { length: 1000 }).notNull(),
  poredak: integer("poredak").notNull().default(0),

  kursId: uuid("kurs_id")
    .references(() => kurs.id, { onDelete: "cascade" })
    .notNull(),
});

export const kupljeniKursevi = pgTable(
  "kupljeni_kursevi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    datum: timestamp("datum").notNull(),
    metodPlacanja: varchar("metod_placanja", { length: 50 }).notNull(),
    statusPlacanja: varchar("status_placanja", { length: 50 }).notNull(),

    korisnikId: uuid("korisnik_id")
      .references(() => korisnik.id)
      .notNull(),

    kursId: uuid("kurs_id")
      .references(() => kurs.id)
      .notNull(),
  },
  (table) => ({
    uniqueKupovina: {
      columns: [table.korisnikId, table.kursId],
      unique: true,
    },
  })
);

export const napredak = pgTable(
  "napredak",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    odgledano: boolean("odgledano").notNull(),

    korisnikId: uuid("korisnik_id")
      .references(() => korisnik.id)
      .notNull(),

    videoLekcijaId: uuid("video_lekcija_id")
      .references(() => videoLekcija.id)
      .notNull(),
  },
  (table) => ({
    uniqueNapredak: {
      columns: [table.korisnikId, table.videoLekcijaId],
      unique: true,
    },
  })
);



export interface Config {
  language: {
    ext: string;
    name: string;
    // temporary loose type
    [k: string]: string;
  }[];
}

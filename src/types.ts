/**
 * Type definitions for Pause Action
 */

export interface ActionInputs {
  resumeFile: string;
  templates: string;
  githubToken: string;
  createRelease: boolean;
  releaseTag?: string;
  changelogSource: "commits" | "file" | "manual";
  changelogFile?: string;
  changelogText?: string;
  deployGithubPages: boolean;
}

export interface TemplateManifest {
  name: string;
  type: "latex" | "typst" | "html" | "markdown";
  entrypoint: string;
  output_name: string;
  build_cmd?: string;
  delimiters?: [string, string];
}

export interface TemplateInfo {
  url: string;
  localPath: string;
  manifest: TemplateManifest;
}

export interface ResumeData {
  basics?: {
    name?: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: any;
    profiles?: any[];
  };
  work?: any[];
  volunteer?: any[];
  education?: any[];
  awards?: any[];
  certificates?: any[];
  publications?: any[];
  skills?: any[];
  languages?: any[];
  interests?: any[];
  references?: any[];
  projects?: any[];
}

export interface BuildResult {
  template: string;
  outputPath: string;
  success: boolean;
  error?: string;
  templateType?: "latex" | "typst" | "html" | "markdown";
}

export interface ReleaseInfo {
  tag: string;
  name: string;
  body: string;
  htmlUrl: string;
  uploadUrl: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

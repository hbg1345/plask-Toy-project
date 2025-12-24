export type TaskInfo = {
    task_url: string;
    title: string;
    problem_statement: string;
    constraint: string;
    input: string;
    output: string;
    samples?: {
        input: string;
        output: string;
    }[];
}
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, test, expect, vi, afterEach } from "vitest";
import DiseaseDetection from "./DiseaseDetection";

afterEach(() => {
  cleanup();
});

describe("Disease Detection Page", () => {

  test("should display the disease detection page", () => {

    render(<DiseaseDetection />);

    expect(
      screen.getByRole("heading", {
        name: /plant disease detection/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /detect disease/i,
      })
    ).toBeInTheDocument();

  });


  test("should show disease result after successful prediction", async () => {

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            class_id: 0,
            confidence: 99.5,
          }),
      })
    );

    render(<DiseaseDetection />);

    const file = new File(
      ["fake image"],
      "plant.jpg",
      { type: "image/jpeg" }
    );

    const input = document.querySelector(
      'input[type="file"]'
    );

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /detect disease/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/disease detected/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/99.5%/)
    ).toBeInTheDocument();

  });

});
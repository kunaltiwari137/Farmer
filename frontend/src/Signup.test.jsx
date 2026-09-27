import "@testing-library/jest-dom/vitest";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

import { describe, test, expect, afterEach, vi } from "vitest";

import { MemoryRouter } from "react-router-dom";

import Signup from "./Signup";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from "axios";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Signup Page", () => {

  test("should display signup form", () => {

    render(
      <MemoryRouter>
        <Signup onLoginSuccess={() => {}} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "Create Account",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sign Up",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Log in",
      })
    ).toBeInTheDocument();

  });


  test("should show success message after successful signup", async () => {

    axios.post.mockResolvedValue({
      data: {
        message: "Signup successful",
      },
    });

    render(
      <MemoryRouter>
        <Signup onLoginSuccess={() => {}} />
      </MemoryRouter>
    );

    const nameInput = document.querySelector(
      'input[type="text"]'
    );

    const emailInput = document.querySelector(
      'input[type="email"]'
    );

    const passwordInput = document.querySelector(
      'input[type="password"]'
    );

    const phoneInput = document.querySelector(
      'input[type="tel"]'
    );

    fireEvent.change(nameInput, {
      target: {
        value: "Test Farmer",
      },
    });

    fireEvent.change(emailInput, {
      target: {
        value: "farmer@example.com",
      },
    });

    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });

    fireEvent.change(phoneInput, {
      target: {
        value: "9876543210",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign Up",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Signup successful! Please wait for admin approval/i
        )
      ).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledTimes(1);

  });


  test("should show error when signup fails", async () => {

    axios.post.mockRejectedValue({
      response: {
        data: {
          error: "Email already exists",
        },
      },
    });

    render(
      <MemoryRouter>
        <Signup onLoginSuccess={() => {}} />
      </MemoryRouter>
    );

    const nameInput = document.querySelector(
      'input[type="text"]'
    );

    const emailInput = document.querySelector(
      'input[type="email"]'
    );

    const passwordInput = document.querySelector(
      'input[type="password"]'
    );

    fireEvent.change(nameInput, {
      target: {
        value: "Existing User",
      },
    });

    fireEvent.change(emailInput, {
      target: {
        value: "existing@example.com",
      },
    });

    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sign Up",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Email already exists")
      ).toBeInTheDocument();
    });

  });

});
import React from 'react';
import { render, screen } from '@testing-library/react';
import NewsPagination from '../app/components/NewsPagination';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('NewsPagination Accessibility', () => {
  it('disables Previous on first page', () => {
    render(<NewsPagination currentPage={1} totalPages={10} />);
    const btn = screen.getByRole('link', { name: /previous/i });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).toHaveAttribute('tabindex', '-1');
  });

  it('disables Next on last page', () => {
    render(<NewsPagination currentPage={10} totalPages={10} />);
    const btn = screen.getByRole('link', { name: /next/i });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).toHaveAttribute('tabindex', '-1');
  });

  it('enables both on middle page', () => {
    render(<NewsPagination currentPage={5} totalPages={10} />);
    const prev = screen.getByRole('link', { name: /previous/i });
    const next = screen.getByRole('link', { name: /next/i });
    expect(prev).toHaveAttribute('aria-disabled', 'false');
    expect(next).toHaveAttribute('aria-disabled', 'false');
    expect(prev).not.toHaveAttribute('tabindex');
    expect(next).not.toHaveAttribute('tabindex');
  });
});
